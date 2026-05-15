import { useState, useRef, useEffect, useCallback } from 'react';
import { useAiAssistantAvailable } from '@/hooks/useAiAssistantAvailable';
import { AI_ERROR_OFFLINE } from '@/services/ai/aiNetworkGate';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, MessageSquare, ThumbsUp, ThumbsDown, Copy, Check, RefreshCw, Mic, MicOff, Volume2, VolumeX, AtSign, CheckCircle2, Pencil, Trash2, Plus, CalendarIcon, HelpCircle, Menu, Slash, Settings, ImagePlus } from 'lucide-react';
import { AiLogoIcon } from '@/components/ai-assistant/AiLogoIcon';
import { AiThinkingIndicator } from './AiThinkingIndicator';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { streamMessageToAI, streamMessageToAIWithSystemPrompt, ChatMessage, AIContextOptions } from '@/services/ai/aiAssistantService';
import { getUsableApiKeys } from '@/services/openRouterModelsService';
import { uploadThingService } from '@/services/uploadThingService';
import { getContextualSuggestions } from '@/services/ai/contextAwareness';
import { generateFollowUpQuestions, detectLanguageFromText } from '@/services/ai/aiFollowUpService';
import { 
  parseTaskSuggestions, 
  createTasksFromSuggestions,
  formatCreatedTasksMessage,
  TaskSuggestion,
  detectTaskCreationIntentSmart
} from '@/services/ai/aiTaskCreationService';
import {
  detectFormCreationIntentSmart,
  getFormCreationPrompt,
  parseFormCreationFromResponse,
  executeFormCreation,
  PendingFormCreation,
  ParsedFormData
} from '@/services/ai/aiFormCreationService';
import { toast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { UserMentionDropdown } from './UserMentionDropdown';
import { SlashCommandDropdown, SlashCommand } from './SlashCommandDropdown';
import { ChatEntityForm, EntityFormType } from './ChatEntityForms';
import { AiFeatureTour } from './AiFeatureTour';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { DebugLogsPanel } from './DebugLogsPanel';
import { FormCreationCard } from './FormCreationCard';
import { useAiChatHistory } from '@/hooks/useAiChatHistory';
import { useUserType, getUserRole } from '@/hooks/useUserType';
import { SystemLog } from '@/services/api/logsApi';

/**
 * Cleans form JSON from AI response content for display
 * More aggressive cleaning to ensure no JSON leaks to UI
 */
function cleanFormJsonFromContent(content: string): string {
  let cleaned = content;
  
  // 1. Remove hidden JSON blocks (main pattern) - handle multiline
  cleaned = cleaned.replace(/<!--\s*FORM_JSON_START\s*-->[\s\S]*?<!--\s*FORM_JSON_END\s*-->/gi, '');
  
  // 2. Remove partial/incomplete hidden blocks (streaming might show partial)
  cleaned = cleaned.replace(/<!--\s*FORM_JSON_START\s*-->[\s\S]*/gi, '');
  cleaned = cleaned.replace(/[\s\S]*<!--\s*FORM_JSON_END\s*-->/gi, '');
  
  // 3. Remove any remaining HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<!--[^>]*/gi, ''); // Incomplete comments
  
  // 4. Remove JSON code blocks (```json ... ```)
  cleaned = cleaned.replace(/```(?:json)?\s*[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```(?:json)?[^`]*/gi, ''); // Incomplete code blocks
  
  // 5. Remove standalone JSON objects with form-like keys
  cleaned = cleaned.replace(/\{[^{}]*"(?:name_en|name_fr|fields|label_en|label_fr|description_en|description_fr|category)"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, '');
  
  // 6. Remove any JSON-like structures with nested brackets
  cleaned = cleaned.replace(/\{\s*"[^"]+"\s*:\s*(?:"[^"]*"|true|false|null|\d+|\[[\s\S]*?\]|\{[\s\S]*?\})[\s\S]*?\}/g, '');
  
  // 7. Remove lines that look like JSON fragments
  cleaned = cleaned.replace(/^\s*[{}\[\]]\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*"[^"]+"\s*:\s*.*/gm, '');
  
  // 8. Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\s+|\s+$/g, '');
  
  return cleaned.trim();
}

interface AttachedImage {
  file: File;
  previewUrl: string;
}

interface DebugLogsData {
  logs: SystemLog[];
  issueContext?: string;
  suggestedCause?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isStreaming?: boolean;
  isVisionProcessing?: boolean; // Specific flag for image analysis (slower)
  error?: string;
  feedback?: 'liked' | 'disliked';
  isRegenerating?: boolean;
  // Task creation state
  pendingTasks?: TaskSuggestion[];
  tasksCreated?: boolean;
  // Form creation state
  pendingForm?: PendingFormCreation;
  formCreated?: boolean;
  formEditUrl?: string;
  // Suggested follow-up questions
  suggestedQuestions?: string[];
  isGeneratingSuggestions?: boolean;
  // Attached images
  attachedImages?: string[]; // Preview URLs for display
  // Debug logs from issue detection
  debugLogs?: DebugLogsData;
}

interface AiAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiAssistantSidebar({ isOpen, onClose }: AiAssistantSidebarProps) {
  const { t, i18n } = useTranslation('aiAssistant');
  const aiAssistantAvailable = useAiAssistantAvailable();

  useEffect(() => {
    if (isOpen && !aiAssistantAvailable) {
      onClose();
    }
  }, [isOpen, aiAssistantAvailable, onClose]);

  const navigate = useNavigate();
  const location = useLocation();
  const userType = useUserType();
  const userRole = getUserRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const assistantMessageIdRef = useRef<string>('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [voiceJustDeactivated, setVoiceJustDeactivated] = useState(false);
  
  // Mention state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  
  // Slash command state
  const [showSlashDropdown, setShowSlashDropdown] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashStartIndex, setSlashStartIndex] = useState<number | null>(null);
  
  // Feature tour state
  const [showFeatureTour, setShowFeatureTour] = useState(false);
  
  // Chat history state
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  
  // Entity creation form state
  const [activeEntityForm, setActiveEntityForm] = useState<EntityFormType | null>(null);
  
  // Image attachment state
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Context awareness state - allow user to disable page context
  const [isContextEnabled, setIsContextEnabled] = useState(true);
  
  // AI Settings state - persisted to localStorage
  const [aiSettings, setAiSettings] = useState<{ autoCreateForms: boolean }>(() => {
    try {
      const stored = localStorage.getItem('ai-assistant-settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
    return { autoCreateForms: true }; // Default to auto-create enabled
  });
  
  // Rate limiting state - prevent abuse
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const RATE_LIMIT_MINUTE_WINDOW_MS = 60000; // 1 minute window
  const RATE_LIMIT_HOUR_WINDOW_MS = 3600000; // 1 hour window
  const RATE_LIMIT_MAX_PER_MINUTE = 1; // Max 1 message per minute
  const RATE_LIMIT_MAX_PER_HOUR = 5; // Max 5 messages per hour
  const _RATE_LIMIT_COOLDOWN_MS = 60000; // 1 minute cooldown after hitting limit
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  
  // Check if user is rate limited
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Check if currently in cooldown
    if (rateLimitedUntil && now < rateLimitedUntil) {
      const remainingSeconds = Math.ceil((rateLimitedUntil - now) / 1000);
      toast({
        title: t('rateLimit.title'),
        description: t('rateLimit.cooldown', { seconds: remainingSeconds }),
        variant: 'destructive',
      });
      return false;
    }
    
    // Clear expired cooldown
    if (rateLimitedUntil && now >= rateLimitedUntil) {
      setRateLimitedUntil(null);
    }
    
    // Filter timestamps within windows
    const recentMinuteTimestamps = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_MINUTE_WINDOW_MS);
    const recentHourTimestamps = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_HOUR_WINDOW_MS);
    
    // Check if per-minute limit exceeded
    if (recentMinuteTimestamps.length >= RATE_LIMIT_MAX_PER_MINUTE) {
      const oldestInMinute = Math.min(...recentMinuteTimestamps);
      const waitUntil = oldestInMinute + RATE_LIMIT_MINUTE_WINDOW_MS;
      const remainingSeconds = Math.ceil((waitUntil - now) / 1000);
      toast({
        title: t('rateLimit.title'),
        description: t('rateLimit.perMinute', { seconds: remainingSeconds }),
        variant: 'destructive',
      });
      return false;
    }
    
    // Check if per-hour limit exceeded
    if (recentHourTimestamps.length >= RATE_LIMIT_MAX_PER_HOUR) {
      const oldestInHour = Math.min(...recentHourTimestamps);
      const waitUntil = oldestInHour + RATE_LIMIT_HOUR_WINDOW_MS;
      const remainingMinutes = Math.ceil((waitUntil - now) / 60000);
      toast({
        title: t('rateLimit.title'),
        description: t('rateLimit.perHour', { minutes: remainingMinutes }),
        variant: 'destructive',
      });
      return false;
    }
    
    // Add current timestamp and update state
    setMessageTimestamps([...recentHourTimestamps, now]);
    return true;
  }, [messageTimestamps, rateLimitedUntil, t]);
  
  // Persist AI settings to localStorage
  const updateAiSettings = useCallback((updates: Partial<typeof aiSettings>) => {
    setAiSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem('ai-assistant-settings', JSON.stringify(newSettings));
      } catch (e) {
        console.error('Failed to save AI settings:', e);
      }
      return newSettings;
    });
  }, []);
  
  // Use the AI chat history hook for API integration
  const {
    conversations,
    currentConversationId,
    currentMessages,
    isLoading: isLoadingHistory,
    isLoadingMessages: _isLoadingMessages,
    isSaving: _isSavingHistory,
    loadConversation,
    deleteConversation,
    renameConversation,
    clearAllConversations,
    pinConversation,
    archiveConversation,
    startNewConversation,
    saveMessagePair,
    ensureConversation: _ensureConversation,
    updateFeedback,
  } = useAiChatHistory();

  // Speech recognition hook
  const { 
    isListening, 
    isSupported: isSpeechSupported, 
    transcript,
    finalTranscript,
    error: speechError,
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechRecognition();

  // Speech synthesis hook for text-to-speech
  const {
    isSpeaking,
    isSupported: isTTSSupported,
    error: ttsError,
    speak,
    stop: stopSpeaking
  } = useSpeechSynthesis();

  // Get speech recognition language based on current app language
  const getSpeechLanguage = useCallback(() => {
    const currentLang = i18n.language;
    if (currentLang.startsWith('fr')) return 'fr-FR';
    return 'en-US';
  }, [i18n.language]);

  // Detect language from text content for text-to-speech
  const detectContentLanguage = useCallback((text: string): string => {
    // French indicators - common French words and patterns
    const frenchWords = [
      'bonjour', 'merci', 'comment', 'pourquoi', 'quoi', 'avec', 'dans', 'pour', 'vous', 'nous',
      'cette', 'cet', 'cette', 'ces', 'sont', 'avoir', 'être', 'fait', 'faire', 'peut',
      'votre', 'notre', 'leur', 'aussi', 'mais', 'donc', 'alors', 'bien', 'très', 'plus',
      'ici', 'maintenant', 'aujourd', 'demain', 'hier', 'toujours', 'jamais', 'encore',
      'je', 'tu', 'il', 'elle', 'on', 'ils', 'elles', 'qui', 'que', 'où',
      'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'à', 'au', 'aux',
      'est', 'sont', 'était', 'étaient', 'sera', 'seront', 'serait',
      'd\'', 'l\'', 'n\'', 'c\'', 'j\'', 's\'', 'qu\''
    ];
    
    const lowerText = text.toLowerCase();
    
    // Count French word matches
    let frenchScore = 0;
    for (const word of frenchWords) {
      const regex = new RegExp(`\\b${word}\\b|${word}`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        frenchScore += matches.length;
      }
    }
    
    // Check for French-specific patterns (accented characters are strong indicators)
    const frenchAccents = (lowerText.match(/[éèêëàâäùûüôöîïç]/g) || []).length;
    frenchScore += frenchAccents * 2; // Weight accents more heavily
    
    // Calculate word count for ratio
    const wordCount = text.split(/\s+/).length;
    const frenchRatio = frenchScore / Math.max(wordCount, 1);
    
    // If French ratio is significant, use French
    if (frenchRatio > 0.15 || frenchScore > 5) {
      return 'fr-FR';
    }
    
    return 'en-US';
  }, []);

  // Handle voice input toggle
  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInputValue(''); // Clear input before starting
      startListening(getSpeechLanguage());
      toast({
        title: t('voiceListening'),
        description: t('voiceListeningDesc'),
        duration: 2000,
      });
    }
  }, [isListening, startListening, stopListening, resetTranscript, getSpeechLanguage, t]);

  // Update input value with live transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  // Ensure final transcript is set when user stops speaking
  useEffect(() => {
    if (!isListening && finalTranscript) {
      setInputValue(finalTranscript);
      // Focus the input after voice input stops
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isListening, finalTranscript]);

  // Show error toast for speech recognition errors
  useEffect(() => {
    if (speechError) {
      toast({
        title: t('voiceError'),
        description: speechError,
        variant: 'destructive',
      });
    }
  }, [speechError, t]);

  // Show error toast for TTS errors
  useEffect(() => {
    if (ttsError) {
      toast({
        title: t('ttsError'),
        description: ttsError,
        variant: 'destructive',
      });
    }
  }, [ttsError, t]);

  // Reset speaking message ID when speech stops
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  // Restore messages from history when sidebar opens or conversation is loaded
  useEffect(() => {
    if (currentMessages.length > 0 && messages.length === 0) {
      // Transform API messages to component messages
      const restoredMessages: Message[] = currentMessages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        feedback: msg.feedback as 'liked' | 'disliked' | undefined,
      }));
      setMessages(restoredMessages);
    }
  }, [currentMessages, messages.length]);

  // Handle text-to-speech for a message - detects language from content
  const handleSpeak = useCallback((messageId: string, content: string) => {
    if (isSpeaking && speakingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopSpeaking(); // Stop any current speech
      setSpeakingMessageId(messageId);
      // Detect language from message content, not UI language
      const contentLanguage = detectContentLanguage(content);
      speak(content, contentLanguage);
    }
  }, [isSpeaking, speakingMessageId, speak, stopSpeaking, detectContentLanguage]);

  // Handle @ mention and / slash command detection in input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setInputValue(value);
    
    const textBeforeCursor = value.slice(0, cursorPos);
    
    // Check for / slash command trigger
    const slashIndex = textBeforeCursor.lastIndexOf('/');
    if (slashIndex !== -1) {
      // Check if / is at start or preceded by space
      const charBefore = slashIndex > 0 ? value[slashIndex - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || slashIndex === 0) {
        const query = textBeforeCursor.slice(slashIndex + 1);
        // Only show dropdown if no space after / (user is still typing the command)
        if (!query.includes(' ')) {
          setShowSlashDropdown(true);
          setSlashQuery(query);
          setSlashStartIndex(slashIndex);
          // Close mention dropdown
          setShowMentionDropdown(false);
          return;
        }
      }
    }
    
    // Close slash dropdown if no valid / command
    setShowSlashDropdown(false);
    setSlashQuery('');
    setSlashStartIndex(null);
    
    // Check for @ mention trigger
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      // Check if @ is at start or preceded by space
      const charBefore = atIndex > 0 ? value[atIndex - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || atIndex === 0) {
        const query = textBeforeCursor.slice(atIndex + 1);
        // Only show dropdown if no space after @ (user is still typing the mention)
        if (!query.includes(' ')) {
          setShowMentionDropdown(true);
          setMentionQuery(query);
          setMentionStartIndex(atIndex);
          return;
        }
      }
    }
    
    // Close dropdown if no valid @ mention
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(null);
  }, []);

  // Handle user selection from mention dropdown
  const handleMentionSelect = useCallback((user: { id: number; name: string }) => {
    if (mentionStartIndex === null) return;
    
    const beforeMention = inputValue.slice(0, mentionStartIndex);
    const cursorPos = inputRef.current?.selectionStart || inputValue.length;
    const afterMention = inputValue.slice(cursorPos);
    
    // Insert the user name
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    setInputValue(newValue);
    
    // Close dropdown
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    
    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeMention.length + user.name.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [inputValue, mentionStartIndex]);

  // Close mention dropdown
  const handleMentionClose = useCallback(() => {
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(null);
  }, []);

  // Handle close - also stops the tour (moved before handleSlashSelect to avoid reference error)
  const handleClose = useCallback(() => {
    setShowFeatureTour(false);
    setActiveEntityForm(null);
    onClose();
  }, [onClose]);

  // Handle slash command selection
  const handleSlashSelect = useCallback((command: SlashCommand) => {
    // Close dropdown first
    setShowSlashDropdown(false);
    setSlashQuery('');
    setSlashStartIndex(null);
    
    // Handle entity creation commands - show forms instead of inserting text
    if (command.id === 'newcontact') {
      setActiveEntityForm('contact');
      setInputValue('');
      return;
    }
    if (command.id === 'newinstallation') {
      setActiveEntityForm('installation');
      setInputValue('');
      return;
    }
    if (command.id === 'newarticle') {
      setActiveEntityForm('article');
      setInputValue('');
      return;
    }
    
    // Handle navigation commands
    if (command.id === 'calendar') {
      handleClose();
      navigate('/dashboard/calendar');
      return;
    }
    if (command.id === 'contacts') {
      handleClose();
      navigate('/dashboard/contacts');
      return;
    }
    if (command.id === 'installations') {
      handleClose();
      navigate('/dashboard/field/installations');
      return;
    }
    if (command.id === 'articles') {
      handleClose();
      navigate('/dashboard/articles');
      return;
    }
    
    // Default behavior: insert the command prompt into input
    if (slashStartIndex === null) return;
    
    const beforeSlash = inputValue.slice(0, slashStartIndex);
    const cursorPos = inputRef.current?.selectionStart || inputValue.length;
    const afterSlash = inputValue.slice(cursorPos);
    
    // Insert the command prompt
    const prompt = command.prompt || '';
    const newValue = `${beforeSlash}${prompt}${afterSlash}`;
    setInputValue(newValue);
    
    // Focus back on input at end of prompt
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeSlash.length + prompt.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [inputValue, slashStartIndex, handleClose, navigate]);

  // Close slash command dropdown
  const handleSlashClose = useCallback(() => {
    setShowSlashDropdown(false);
    setSlashQuery('');
    setSlashStartIndex(null);
  }, []);

  // Custom link handler for internal navigation
  const handleLinkClick = useCallback((href: string) => {
    if (href.startsWith('/')) {
      handleClose();
      navigate(href);
    } else {
      window.open(href, '_blank');
    }
  }, [navigate, handleClose]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const updateAssistantMessage = useCallback((content: string) => {
    const messageId = assistantMessageIdRef.current;
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId
          ? { ...msg, content, isLoading: false, isStreaming: true }
          : msg
      )
    );
  }, []);

  // Handle task creation from AI response
  const handleCreateTasks = useCallback(async (messageId: string, tasks: TaskSuggestion[]) => {
    setIsLoading(true);
    
    try {
      const result = await createTasksFromSuggestions(tasks);
      
      // Update message to show created tasks
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId
            ? { 
                ...msg, 
                content: msg.content + '\n\n---\n\n' + formatCreatedTasksMessage(result),
                pendingTasks: undefined,
                tasksCreated: true
              }
            : msg
        )
      );
      
      toast({
        title: result.success ? `✅ ${t('tasksCreated')}` : `❌ ${t('taskCreationFailed')}`,
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (_error) {
      toast({
        title: `❌ ${t('error')}`,
        description: t('taskCreationError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Handle form creation from AI response
  const handleCreateForm = useCallback(async (messageId: string, formData: ParsedFormData) => {
    setIsLoading(true);
    
    // Detect language from the conversation
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
    const language = lastUserMsg ? detectLanguageFromText(lastUserMsg.content) : 'en';
    
    try {
      const { result, formattedMessage } = await executeFormCreation(formData, language);
      
      // Update message to show created form - keep pendingForm for the success card
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId
            ? { 
                ...msg, 
                content: msg.content + '\n\n---\n\n' + formattedMessage,
                formCreated: true,
                formEditUrl: result.editUrl
              }
            : msg
        )
      );
      
      toast({
        title: result.success 
          ? `✅ ${language === 'fr' ? 'Formulaire créé' : 'Form created'}` 
          : `❌ ${language === 'fr' ? 'Échec' : 'Failed'}`,
        description: result.success 
          ? (language === 'fr' ? `${result.form?.name_fr} créé avec succès` : `${result.form?.name_en} created successfully`)
          : result.error,
        variant: result.success ? 'default' : 'destructive',
      });
      
      // Offer to navigate to the form editor
      if (result.success && result.editUrl) {
        setTimeout(() => {
          toast({
            title: language === 'fr' ? '📋 Modifier le formulaire?' : '📋 Edit the form?',
            description: language === 'fr' 
              ? 'Cliquez pour ouvrir le formulaire dans l\'éditeur'
              : 'Click to open the form in the editor',
            action: (
              <Button 
                size="sm" 
                onClick={() => navigate(result.editUrl!)}
                className="gap-1"
              >
                <Pencil className="h-3 w-3" />
                {language === 'fr' ? 'Modifier' : 'Edit'}
              </Button>
            ),
          });
        }, 500);
      }
    } catch (_error) {
      toast({
        title: `❌ ${t('error')}`,
        description: t('formCreationError', 'Failed to create form'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, navigate, t]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    const hasAttachments = attachedImages.length > 0;
    
    // Allow sending with just images (no text required)
    if (!trimmedInput && !hasAttachments) return;
    if (isLoading) return;

    if (!aiAssistantAvailable) {
      toast({
        title: t('error'),
        description: t('offlineUnavailable'),
        variant: 'destructive',
      });
      return;
    }
    
    // Check rate limit before proceeding
    if (!checkRateLimit()) return;

    // Stop voice recording if active when sending message - use immediate to fully release browser mic
    if (isListening) {
      stopListening(true); // immediate=true for instant browser-level termination
      resetTranscript();
      // Trigger visual feedback animation
      setVoiceJustDeactivated(true);
      setTimeout(() => setVoiceJustDeactivated(false), 600);
    }

    // Upload images to UploadThing and get URLs for AI analysis
    let imageUrls: string[] = [];
    if (hasAttachments) {
      try {
        // Show uploading status
        toast({
          title: t('attachments.uploadingImages'),
          description: t('attachments.uploadingDesc'),
        });
        
        // Use backend upload endpoint (avoids browser-to-ingest CORS/content-type issues)
        const uploadResults = await uploadThingService.uploadFiles(attachedImages.map(img => img.file));
        
        // Filter successful uploads and get URLs
        const successfulUploads = uploadResults.filter(r => r.success);
        if (successfulUploads.length === 0) {
          throw new Error('All uploads failed');
        }
        
        imageUrls = successfulUploads.map(r => r.fileUrl);
      } catch (error) {
        console.error('Failed to upload images:', error);
        toast({
          title: t('error'),
          description: t('attachments.uploadFailed'),
          variant: 'destructive',
        });
        return;
      }
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput || (hasAttachments ? t('attachments.imageLabel') : ''),
      timestamp: new Date(),
      attachedImages: attachedImages.map(img => img.previewUrl)
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    assistantMessageIdRef.current = assistantMessageId;
    
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      isVisionProcessing: hasAttachments // Flag for image processing indicator
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setAttachedImages([]); // Clear attachments after sending
    setIsLoading(true);

    // Run intent detection in parallel — don't block the AI response
    // Start intent detection but DON'T await it yet
    const intentPromise = Promise.all([
      detectFormCreationIntentSmart(trimmedInput),
      detectTaskCreationIntentSmart(trimmedInput),
    ]);

    // We'll resolve intents later, but start streaming immediately
    let isFormCreationIntent = false;
    let isTaskCreationIntent = false;
    let formCreationCheck: Awaited<ReturnType<typeof detectFormCreationIntentSmart>> | null = null;

    try {
      const conversationHistory: ChatMessage[] = messages
        .filter(m => !m.isLoading && !m.error)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Build context options for AI awareness (only if context is enabled)
      const contextOptions: AIContextOptions = isContextEnabled ? {
        currentRoute: location.pathname,
        userData: {
          userName: userType.userId ? `User ${userType.userId}` : undefined,
          userRole: userRole || undefined,
          isMainAdmin: userType.isMainAdminUser
        }
      } : {};

      const handleStreamDone = async () => {
        // When streaming is done, get the content and set loading state for suggestions
        let messageContent = '';
        setMessages(prev => {
          const updatedMessages = prev.map(msg => {
            if (msg.id === assistantMessageId) {
              messageContent = msg.content || '';
              return { ...msg, isStreaming: false, isGeneratingSuggestions: true };
            }
            return msg;
          });
          return updatedMessages;
        });

        // Wait a tick for state to update and get content
        await new Promise(resolve => setTimeout(resolve, 50));

        // If we didn't capture content, try again from current state
        if (!messageContent) {
          setMessages(prev => {
            const msg = prev.find(m => m.id === assistantMessageId);
            messageContent = msg?.content || '';
            return prev;
          });
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Auto-save
        if (messageContent) {
          saveMessagePair(trimmedInput, messageContent).catch(err => {
            console.error('Auto-save failed:', err);
          });
        }

        // Generate follow-up questions asynchronously
        const detectedLang = detectLanguageFromText(trimmedInput);

        // CRITICAL: Handle form creation FIRST to ensure it always works
        // Even if messageContent is empty, we can still create a form from the original request
        if (isFormCreationIntent) {

          // Parse form from response OR fallback to generating from request
          const pendingForm = parseFormCreationFromResponse(messageContent || '', trimmedInput, formCreationCheck.extractedContext);

          if (pendingForm && pendingForm.data.fields.length > 0) {
            // Check if auto-create is enabled
            const shouldAutoCreate = (() => {
              try {
                const stored = localStorage.getItem('ai-assistant-settings');
                if (stored) {
                  const settings = JSON.parse(stored);
                  return settings.autoCreateForms !== false;
                }
              } catch (_e) {}
              return true; // Default to auto-create
            })();

            if (shouldAutoCreate) {
              try {
                const { result } = await executeFormCreation(pendingForm.data, 'en');

                if (result.success) {
                  toast({
                    title: t('formCreated', 'Form created!'),
                    description: result.form?.name_en,
                  });
                  // Update message to show form was created
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, pendingForm, formCreated: true, formEditUrl: result.editUrl, isGeneratingSuggestions: false }
                      : m
                  ));
                } else {
                  // Show error toast if auto-create fails
                  toast({
                    title: t('formCreationFailed', 'Form creation failed'),
                    description: result.error || 'Unknown error',
                    variant: 'destructive',
                  });
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, pendingForm, isGeneratingSuggestions: false }
                      : m
                  ));
                }
              } catch (err: any) {
                console.error('[FormCreation] Failed to auto-create form:', err);
                toast({
                  title: t('formCreationFailed', 'Form creation failed'),
                  description: err.message || 'Unknown error',
                  variant: 'destructive',
                });
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, pendingForm, isGeneratingSuggestions: false }
                    : m
                ));
              }
            } else {
              // Manual mode: show pending form for user confirmation
              
              setMessages(prev => prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, pendingForm, isGeneratingSuggestions: false }
                  : m
              ));
            }
          } else {
            
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId ? { ...m, isGeneratingSuggestions: false } : m
            ));
          }

          setIsLoading(false);
          return; // Exit early - don't run other follow-up logic
        }

        if (messageContent) {
          try {
            const suggestedQuestions = await generateFollowUpQuestions(trimmedInput, messageContent, detectedLang);

            setMessages(prev => prev.map(msg => {
              if (msg.id === assistantMessageId) {
                // Check if AI response contains tasks to create
                if (isTaskCreationIntent && msg.content) {
                  const parsedTasks = parseTaskSuggestions(msg.content);
                  if (parsedTasks.length > 0) {
                    return {
                      ...msg,
                      pendingTasks: parsedTasks,
                      suggestedQuestions,
                      isGeneratingSuggestions: false,
                    };
                  }
                }
                return { ...msg, suggestedQuestions, isGeneratingSuggestions: false };
              }
              return msg;
            }));
          } catch (error) {
            console.error('Failed to generate follow-up questions:', error);
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, isGeneratingSuggestions: false } : msg
            ));
          }
        } else {
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId ? { ...msg, isGeneratingSuggestions: false } : msg
          ));
        }

        setIsLoading(false);
      };

      // Start streaming immediately (don't wait for intent detection)
      // Also race intent detection to complete alongside
      const [response, intentResults] = await Promise.all([
        streamMessageToAI(
          trimmedInput || t('attachments.analyzeImage'),
          conversationHistory,
          updateAssistantMessage,
          handleStreamDone,
          contextOptions,
          imageUrls.length > 0 ? imageUrls : undefined
        ),
        intentPromise.catch(() => [null, null] as const),
      ]);

      // Resolve intent results (completed alongside streaming)
      if (intentResults && intentResults[0] && intentResults[1]) {
        formCreationCheck = intentResults[0];
        const taskCreationCheck = intentResults[1];
        isFormCreationIntent = formCreationCheck.hasIntent;
        isTaskCreationIntent = !isFormCreationIntent && taskCreationCheck.hasIntent;
      }

      // Update message with issue analysis if present
      if (response.issueAnalysis && response.issueAnalysis.logs.length > 0) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  debugLogs: {
                    logs: response.issueAnalysis!.logs as unknown as SystemLog[],
                    issueContext: response.issueAnalysis!.issueContext,
                    suggestedCause: response.issueAnalysis!.suggestedCause,
                  }
                }
              : msg
          )
        );
      }

      if (response.error || response.isResting) {
        const errorMsg =
          response.error === AI_ERROR_OFFLINE
            ? t('offlineUnavailable')
            : response.isResting
              ? t('aiRestingMessage')
              : t('errorMessage');
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId
              ? { ...msg, content: errorMsg, isLoading: false, isStreaming: false, error: response.error }
              : msg
          )
        );
      }
    } catch (_error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId
            ? { ...msg, content: t('errorMessage'), isLoading: false, isStreaming: false, error: 'Failed to get response' }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const _handleClearChat = () => {
    setMessages([]);
    setAttachedImages([]);
    startNewConversation();
  };

  // Image attachment handlers
  const _handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: AttachedImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('error'),
          description: t('attachments.onlyImages'),
          variant: 'destructive',
        });
        continue;
      }
      
      // Max 5MB per image
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('attachments.imageTooLargeName', { name: file.name }),
          variant: 'destructive',
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newImages.push({ file, previewUrl });
    }

    // Max 4 images at once
    setAttachedImages(prev => [...prev, ...newImages].slice(0, 4));
    
    // Reset input so same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [t]);

  const handleRemoveImage = useCallback((index: number) => {
    setAttachedImages(prev => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Handle drag events for image drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: t('error'),
        description: t('attachments.onlyImages'),
        variant: 'destructive',
      });
      return;
    }

    const newImages: AttachedImage[] = [];
    for (const file of imageFiles) {
      // Max 5MB per image
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('attachments.imageTooLargeName', { name: file.name }),
          variant: 'destructive',
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newImages.push({ file, previewUrl });
    }

    // Max 4 images at once
    setAttachedImages(prev => [...prev, ...newImages].slice(0, 4));
  }, [t]);

  // Handle paste for images from clipboard
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    // Prevent default paste behavior for images
    e.preventDefault();

    const newImages: AttachedImage[] = [];
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (!file) continue;

      // Max 5MB per image
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('attachments.pastedTooLarge'),
          variant: 'destructive',
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newImages.push({ file, previewUrl });
    }

    if (newImages.length > 0) {
      // Max 4 images at once
      setAttachedImages(prev => [...prev, ...newImages].slice(0, 4));
      toast({
        title: t('attachments.imageAttached'),
        description: t('attachments.imagesPasted', { count: newImages.length }),
      });
    }
  }, [t]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    startNewConversation();
  }, [startNewConversation]);

  const handleSelectConversation = useCallback(async (id: number) => {
    const conv = await loadConversation(id);
    if (conv && conv.messages) {
      // Transform API messages to local Message format
      const loadedMessages: Message[] = conv.messages.map(m => ({
        id: `${m.role}-${m.id}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt),
        feedback: m.feedback as 'liked' | 'disliked' | undefined,
      }));
      setMessages(loadedMessages);
      toast({
        title: t('history.conversationLoaded'),
        description: conv.title,
      });
    }
  }, [loadConversation, t]);

  const handleDeleteConversation = useCallback(async (id: number) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      setMessages([]);
    }
  }, [currentConversationId, deleteConversation]);

  const handlePinConversation = useCallback(async (id: number, pin: boolean) => {
    await pinConversation(id, pin);
  }, [pinConversation]);

  const handleArchiveConversation = useCallback(async (id: number, archive: boolean) => {
    await archiveConversation(id, archive);
  }, [archiveConversation]);

  // Wrap clearAllConversations to also clear local messages state
  const handleClearAllConversations = useCallback(async () => {
    const result = await clearAllConversations();
    if (result) {
      setMessages([]); // Clear local messages to start fresh
    }
    return result;
  }, [clearAllConversations]);

  // Copy message to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: t('copied') || 'Copied!',
        description: t('copiedToClipboard') || 'Response copied to clipboard',
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (_error) {
      toast({
        title: t('error'),
        description: t('copyFailed'),
        variant: 'destructive',
      });
    }
  };

  // Handle feedback (like/dislike)
  const handleFeedback = async (messageId: string, feedback: 'liked' | 'disliked') => {
    // Update local state immediately for responsiveness
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );

    // Persist feedback to database
    const numericId = parseInt(messageId, 10);
    if (!isNaN(numericId)) {
      await updateFeedback(numericId, feedback);
    }

    if (feedback === 'disliked') {
      // Find the user message that triggered this response
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex > 0) {
        const userMessage = messages[messageIndex - 1];
        if (userMessage.role === 'user') {
          // Regenerate with a different approach
          await handleRegenerate(messageId, userMessage.content);
        }
      }
    } else {
      toast({
        title: '👍 ' + (t('thanksFeedback') || 'Thanks for your feedback!'),
        description: t('gladItHelped') || 'Glad the response was helpful.',
      });
    }
  };

  // Regenerate response
  const handleRegenerate = async (messageId: string, originalQuestion: string) => {
    // Mark as regenerating
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isRegenerating: true, content: '', isLoading: true } : msg
      )
    );
    setIsLoading(true);

    try {
      // Get conversation history up to but not including the disliked message
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const conversationHistory: ChatMessage[] = messages
        .slice(0, messageIndex - 1)
        .filter(m => !m.isLoading && !m.error)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Add instruction to give different response
      const enhancedQuestion = `${originalQuestion}\n\n[Note: Please provide a different, alternative response. Be more detailed or try a different approach.]`;

      assistantMessageIdRef.current = messageId;

      // Build context options for AI awareness (only if context is enabled)
      const contextOptions: AIContextOptions = isContextEnabled ? {
        currentRoute: location.pathname,
        userData: {
          userName: userType.userId ? `User ${userType.userId}` : undefined,
          userRole: userRole || undefined,
          isMainAdmin: userType.isMainAdminUser
        }
      } : {};

      const response = await streamMessageToAI(
        enhancedQuestion,
        conversationHistory,
        updateAssistantMessage,
        () => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === messageId
                ? { ...msg, isStreaming: false, isRegenerating: false, isLoading: false, feedback: undefined }
                : msg
            )
          );
          setIsLoading(false);
        },
        contextOptions
      );

      if (response.error || response.isResting) {
        const errorMsg =
          response.error === AI_ERROR_OFFLINE
            ? t('offlineUnavailable')
            : response.isResting
              ? t('aiRestingMessage')
              : t('errorMessage');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: errorMsg, isLoading: false, isStreaming: false, isRegenerating: false, error: response.error }
              : msg
          )
        );
      }

      toast({
        title: '🔄 ' + (t('regenerated') || 'Response regenerated'),
        description: t('tryNewResponse') || 'Here\'s a different response for you.',
      });
    } catch (_error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: t('errorMessage'), isLoading: false, isStreaming: false, isRegenerating: false, error: 'Failed to regenerate' }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  // Get contextual suggestions based on current page and translate them
  const contextualSuggestions = getContextualSuggestions(location.pathname);
  const suggestions = contextualSuggestions.length > 0 
    ? contextualSuggestions.map(key => t(key, key))
    : [t('suggestion1'), t('suggestion2'), t('suggestion3')];

  // Render in a portal so the overlay isn't affected by parent stacking/filters
  // (some layouts can make `position: fixed` behave like it's relative to an ancestor).
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <>
      {/* Feature Tour */}
      <AiFeatureTour 
        run={showFeatureTour} 
        onFinish={() => setShowFeatureTour(false)} 
      />
      
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showHistorySidebar}
        onClose={() => setShowHistorySidebar(false)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onPinConversation={handlePinConversation}
        onArchiveConversation={handleArchiveConversation}
        onRenameConversation={renameConversation}
        onClearAllConversations={handleClearAllConversations}
        isLoading={isLoadingHistory}
      />
      
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/30 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />
      
      {/* Sidebar - Mobile responsive */}
      <div 
        className={cn(
          // Opaque surface so it never looks transparent in dark mode
          "fixed inset-y-0 right-0 w-full sm:w-[440px] bg-card z-50 flex flex-col transition-transform duration-300 ease-out shadow-[−8px_0_30px_-10px_hsl(var(--foreground)/0.08)] border-l border-border/60",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/95 backdrop-blur-sm" data-tour="ai-header">
          <div className="flex items-center gap-2">
            {/* History Menu Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistorySidebar(true)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('history.openHistory')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <AiLogoIcon size={14} variant="light" />
            </div>
            <span className="text-foreground font-medium text-[13px]">{t('title')}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Discover Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowFeatureTour(true)}
                    className="text-xs text-primary hover:text-primary hover:bg-primary/10 h-7 px-2 gap-1"
                  >
                    
                    {t('discover')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('discoverTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Help Button with Popover */}
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-foreground hover:text-foreground hover:bg-muted h-7 px-2 gap-1"
                        data-tour="ai-help"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {t('help')}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('helpTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent className="w-80 p-4" align="end">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  {t('helpTitle')}
                </h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{t('helpCategories.data').split(' ')[0]}</span>
                    <span className="text-muted-foreground">{t('helpCategories.dataDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{t('helpCategories.availability').split(' ')[0]}</span>
                    <span className="text-muted-foreground">{t('helpCategories.availabilityDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{t('helpCategories.tasks').split(' ')[0]}</span>
                    <span className="text-muted-foreground">{t('helpCategories.tasksDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{t('helpCategories.navigation').split(' ')[0]}</span>
                    <span className="text-muted-foreground">{t('helpCategories.navigationDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{t('helpCategories.issues').split(' ')[0]}</span>
                    <span className="text-muted-foreground">{t('helpCategories.issuesDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{t('helpCategories.images').split(' ')[0]}</span>
                    <span className="text-muted-foreground">{t('helpCategories.imagesDesc')}</span>
                  </div>
                </div>
                
                {/* Example prompts */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">{t('helpExamples')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[t('helpExample1'), t('helpExample2'), t('helpExample3'), t('helpExample5')].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(example.replace(/"/g, ''));
                          inputRef.current?.focus();
                        }}
                        className="text-xs px-2 py-1 rounded-full bg-muted border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 min-h-0 [&>[data-radix-scroll-area-viewport]]:!flex [&>[data-radix-scroll-area-viewport]]:!flex-row-reverse [&_[data-radix-scroll-area-scrollbar]]:bg-primary/20 [&_[data-radix-scroll-area-thumb]]:bg-primary"
          data-tour="ai-messages"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col px-4 sm:px-6 pt-8 pb-4">
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="24" r="14" className="fill-primary/80"/>
                  <circle cx="44" cy="24" r="14" className="fill-chart-2/80"/>
                  <circle cx="32" cy="42" r="14" className="fill-chart-4/80"/>
                  <circle cx="32" cy="30" r="10" className="fill-background"/>
                </svg>
              </div>
              
              {/* Greeting */}
              <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
                {t('welcomeTitle')}
              </h2>
              
              {/* Suggestions */}
              <div className="w-full space-y-2" data-tour="ai-suggestions">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputValue(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="w-full flex items-start gap-3 text-left text-sm p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground group"
                  >
                    <MessageSquare className="h-5 w-5 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                    <span className="group-hover:text-foreground transition-colors">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 w-full overflow-hidden">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex group w-full min-w-0",
                    message.role === 'user' ? "justify-end" : "justify-start flex-col items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 w-fit max-w-[85%] min-w-0 overflow-hidden text-[13px] leading-relaxed",
                      message.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted/60 text-foreground border border-border/40 rounded-bl-sm",
                      message.error && "bg-destructive/10 text-destructive border-destructive/20"
                    )}
                  >
                    {message.isLoading ? (
                      <AiThinkingIndicator isAnalyzingImage={message.isVisionProcessing} />
                    ) : message.role === 'assistant' ? (
                      <div className="text-sm min-w-0 max-w-full overflow-hidden break-words [word-break:break-word]">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-p:break-words prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-li:break-words prose-headings:my-2 prose-code:bg-muted-foreground/20 prose-code:px-1 prose-code:rounded prose-code:break-all prose-pre:bg-muted-foreground/20 prose-pre:p-2 prose-pre:overflow-x-auto prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children }) => {
                                const displayHref = href?.startsWith('/') 
                                  ? `${window.location.origin}${href}` 
                                  : href;
                                return (
                                  <button
                                    onClick={() => href && handleLinkClick(href)}
                                    className="text-primary font-medium hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                                    title={displayHref}
                                  >
                                    {children}
                                  </button>
                                );
                              },
                              p: ({ children }) => <p className="my-1 break-words">{children}</p>,
                              li: ({ children }) => <li className="my-0.5 break-words">{children}</li>,
                              code: ({ children }) => <code className="break-all">{children}</code>,
                            }}
                          >
                            {cleanFormJsonFromContent(message.content)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {/* Show attached images for user messages */}
                        {message.attachedImages && message.attachedImages.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {message.attachedImages.map((imgUrl, idx) => (
                              <img
                                key={idx}
                                src={imgUrl}
                                alt={`Attached ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-md border border-primary-foreground/20"
                              />
                            ))}
                          </div>
                        )}
                        {/* Render user message with @mention highlighting */}
                        <p>
                          {message.content.split(/(@\w+(?:\s+\w+)?)/g).map((part, idx) => 
                            part.startsWith('@') ? (
                              <span key={idx} className="underline font-medium">
                                {part}
                              </span>
                            ) : (
                              <span key={idx}>{part}</span>
                            )
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Task creation panel - Show when AI has parsed tasks */}
                  {message.role === 'assistant' && message.pendingTasks && message.pendingTasks.length > 0 && !message.tasksCreated && (
                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {t('tasksReady', { count: message.pendingTasks.length })}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCreateTasks(message.id, message.pendingTasks!)}
                          disabled={isLoading}
                          className="h-8 px-3 text-xs gap-1.5"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {t('creating')}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t('createAll')}
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Editable task list */}
                      <div className="space-y-2">
                        {message.pendingTasks.map((task, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5 p-2 bg-background/50 rounded-md border border-border/50">
                            <div className="flex items-center gap-2">
                              {/* Priority selector */}
                              <select
                                value={task.priority}
                                onChange={(e) => {
                                  const newPriority = e.target.value as 'low' | 'medium' | 'high' | 'urgent';
                                  setMessages(prev => prev.map(msg => 
                                    msg.id === message.id && msg.pendingTasks
                                      ? {
                                          ...msg,
                                          pendingTasks: msg.pendingTasks.map((t, i) => 
                                            i === idx ? { ...t, priority: newPriority } : t
                                          )
                                        }
                                      : msg
                                  ));
                                }}
                                className={cn(
                                  "h-7 w-20 text-xs rounded border-0 cursor-pointer focus:ring-1 focus:ring-primary",
                                  task.priority === 'urgent' ? "bg-destructive/20 text-destructive" :
                                  task.priority === 'high' ? "bg-chart-4/20 text-chart-4" :
                                  task.priority === 'medium' ? "bg-chart-5/20 text-chart-5" : 
                                  "bg-chart-2/20 text-chart-2"
                                )}
                              >
                                <option value="low">{t('priorityLow')}</option>
                                <option value="medium">{t('priorityMedium')}</option>
                                <option value="high">{t('priorityHigh')}</option>
                                <option value="urgent">{t('priorityUrgent')}</option>
                              </select>
                              
                              {/* Editable title */}
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => {
                                  const newTitle = e.target.value;
                                  setMessages(prev => prev.map(msg => 
                                    msg.id === message.id && msg.pendingTasks
                                      ? {
                                          ...msg,
                                          pendingTasks: msg.pendingTasks.map((t, i) => 
                                            i === idx ? { ...t, title: newTitle } : t
                                          )
                                        }
                                      : msg
                                  ));
                                }}
                                className="flex-1 h-7 px-2 text-xs bg-transparent border border-border/50 rounded focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                placeholder={t('taskTitlePlaceholder')}
                              />
                              
                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setMessages(prev => prev.map(msg => 
                                    msg.id === message.id && msg.pendingTasks
                                      ? {
                                          ...msg,
                                          pendingTasks: msg.pendingTasks.filter((_, i) => i !== idx)
                                        }
                                      : msg
                                  ));
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            
                            {/* Due date picker */}
                            <div className="flex items-center gap-2 pl-[88px]">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "h-6 px-2 text-[10px] gap-1 justify-start font-normal",
                                      !task.dueDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="h-3 w-3" />
                                    {task.dueDate ? format(new Date(task.dueDate), "MMM d") : t('today')}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={task.dueDate ? new Date(task.dueDate) : new Date()}
                                    onSelect={(date) => {
                                      setMessages(prev => prev.map(msg => 
                                        msg.id === message.id && msg.pendingTasks
                                          ? {
                                              ...msg,
                                              pendingTasks: msg.pendingTasks.map((t, i) => 
                                                i === idx ? { ...t, dueDate: date || undefined } : t
                                              )
                                            }
                                          : msg
                                      ));
                                    }}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add new task button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 h-8 text-xs gap-1.5 border-dashed"
                        onClick={() => {
                          setMessages(prev => prev.map(msg => 
                            msg.id === message.id && msg.pendingTasks
                              ? {
                                  ...msg,
                                  pendingTasks: [
                                    ...msg.pendingTasks,
                                    { title: '', priority: 'medium' as const }
                                  ]
                                }
                              : msg
                          ));
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('addAnotherTask')}
                      </Button>
                      
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Pencil className="h-3 w-3" />
                        {t('editBeforeCreating')}
                      </p>
                    </div>
                  )}
                  
                  {/* Form creation panel - Show when AI has parsed a form */}
                  {message.role === 'assistant' && message.pendingForm && (
                    <FormCreationCard
                      formData={message.pendingForm.data}
                      onCreateForm={() => handleCreateForm(message.id, message.pendingForm!.data)}
                      isCreating={isLoading}
                      isCreated={message.formCreated}
                      editUrl={message.formEditUrl}
                      onNavigateToEdit={() => {
                        if (message.formEditUrl) {
                          handleClose();
                          navigate(message.formEditUrl);
                        }
                      }}
                    />
                  )}
                  
                  {/* Debug Logs Panel - Show when issue was detected and logs found */}
                  {message.role === 'assistant' && !message.isLoading && !message.isStreaming && message.debugLogs && message.debugLogs.logs.length > 0 && (
                    <DebugLogsPanel
                      logs={message.debugLogs.logs}
                      issueContext={message.debugLogs.issueContext}
                      suggestedCause={message.debugLogs.suggestedCause}
                    />
                  )}
                  
                  {/* Action buttons for assistant messages - Always visible */}
                  {message.role === 'assistant' && !message.isLoading && !message.isStreaming && message.content && (
                    <div className="flex items-center gap-1 mt-2">
                      {/* Text-to-Speech button */}
                      {isTTSSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 px-2 text-xs gap-1",
                            isSpeaking && speakingMessageId === message.id
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                          onClick={() => handleSpeak(message.id, message.content)}
                          title={isSpeaking && speakingMessageId === message.id ? t('stopSpeaking') : t('speakResponse')}
                        >
                          {isSpeaking && speakingMessageId === message.id ? (
                            <>
                              <VolumeX className="h-3.5 w-3.5" />
                              <span>{t('stopSpeaking')}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>{t('speakResponse')}</span>
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Copy button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-2 text-xs gap-1",
                          copiedMessageId === message.id 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => handleCopyMessage(message.id, message.content)}
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>{t('copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t('copy')}</span>
                          </>
                        )}
                      </Button>
                      
                      {/* Like button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-2 text-xs gap-1",
                          message.feedback === 'liked' 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => handleFeedback(message.id, 'liked')}
                        disabled={message.feedback === 'liked'}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      
                      {/* Dislike button with regenerate */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-2 text-xs gap-1",
                          message.feedback === 'disliked' 
                            ? "text-destructive bg-destructive/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => handleFeedback(message.id, 'disliked')}
                        disabled={isLoading || message.isRegenerating}
                      >
                        {message.isRegenerating ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>{t('regenerating')}</span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-3.5 w-3.5" />
                            {message.feedback === 'disliked' && <span>{t('regeneratedLabel')}</span>}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Loading indicator for follow-up questions */}
                  {message.role === 'assistant' && !message.isLoading && !message.isStreaming && message.isGeneratingSuggestions && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <AiLogoIcon size={12} className="animate-pulse" />
                        {t('suggestions.generating')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i} 
                            className="h-7 rounded-full bg-muted/50 animate-pulse"
                            style={{ width: `${60 + i * 20}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Suggested follow-up questions */}
                  {message.role === 'assistant' && !message.isLoading && !message.isStreaming && !message.isGeneratingSuggestions && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-w-full overflow-hidden">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <AiLogoIcon size={12} className="flex-shrink-0" />
                        {t('suggestions.title')}
                      </p>
                      <div className="flex flex-col gap-1.5 max-w-full">
                        {message.suggestedQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInputValue(question);
                              inputRef.current?.focus();
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-colors text-foreground/80 hover:text-foreground text-left truncate max-w-full"
                            title={question}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Entity Creation Form (inline above input) */}
        {activeEntityForm && (
          <div className="border-t border-border p-4">
            <ChatEntityForm
              type={activeEntityForm}
              onSuccess={(entity, message) => {
                // Add success message to chat
                const successMsg: Message = {
                  id: `success-${Date.now()}`,
                  role: 'assistant',
                  content: `✅ ${message}\n\nYou can view or edit this ${activeEntityForm} in the ${activeEntityForm === 'contact' ? 'Contacts' : activeEntityForm === 'installation' ? 'Installations' : 'Articles'} section.`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, successMsg]);
                setActiveEntityForm(null);
              }}
              onCancel={() => setActiveEntityForm(null)}
            />
          </div>
        )}

        {/* Context Indicator - Shows current page context above input */}
        {isContextEnabled && location.pathname !== '/' && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              {t('context.label')}:
            </span>
            <span className="text-xs font-semibold text-primary underline underline-offset-2">
              {location.pathname}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsContextEnabled(false)}
                    className="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('context.removeContext')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Input Area */}
        <div 
          className="border-t border-border p-4 bg-background" 
          data-tour="ai-input"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drop overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-10 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <ImagePlus className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-primary">Drop images here</p>
              </div>
            </div>
          )}
          <div className={cn(
            "relative bg-muted/30 rounded-xl border transition-colors shadow-sm",
            isDragging ? "border-primary border-2" : "border-border/60 focus-within:border-primary/50 focus-within:shadow-md"
          )}>
            
            
            {/* Mention Dropdown */}
            <UserMentionDropdown
              isOpen={showMentionDropdown}
              searchQuery={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={handleMentionClose}
            />
            
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              placeholder={isListening ? t('voiceListening') : (attachedImages.length > 0 ? 'Add a message or send image...' : t('inputPlaceholder'))}
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between px-3 pb-2">
              {/* Left buttons: Voice + Mention + Slash */}
              <div className="flex items-center gap-1">
                {/* Voice Input Button */}
                {isSpeechSupported && (
                  <div className="relative">
                    {/* Ripple effect when voice deactivated after sending */}
                    {voiceJustDeactivated && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-success/40" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleVoiceToggle}
                      disabled={isLoading}
                      data-tour="ai-voice"
                      className={cn(
                        "h-8 w-8 rounded-full transition-all duration-300",
                        isListening 
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                        voiceJustDeactivated && "ring-2 ring-success ring-offset-2 ring-offset-background"
                      )}
                      title={isListening ? t('voiceStop') : t('voiceInputTooltip')}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className={cn("h-4 w-4", voiceJustDeactivated && "text-success")} />
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Mention Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-tour="ai-mention"
                        onClick={() => {
                          const newValue = inputValue + '@';
                          setInputValue(newValue);
                          setShowMentionDropdown(true);
                          setMentionQuery('');
                          setMentionStartIndex(inputValue.length);
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                        disabled={isLoading}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <AtSign className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{t('inputHints.mention')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                
                {/* AI Settings Button */}
                <Popover>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-tour="ai-settings"
                            disabled={isLoading}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{t('settings.tooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent className="w-72 p-4" align="start">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t('settings.title')}
                    </h3>
                    
                    {/* Auto-Creation Toggle */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="auto-create-toggle" className="text-sm font-medium cursor-pointer">
                          {t('settings.autoCreation.label')}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('settings.autoCreation.description')}
                        </p>
                      </div>
                      <Switch
                        id="auto-create-toggle"
                        checked={aiSettings.autoCreateForms}
                        onCheckedChange={(checked) => updateAiSettings({ autoCreateForms: checked })}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Send Button */}
              <Button 
                onClick={handleSendMessage} 
                disabled={(!inputValue.trim() && attachedImages.length === 0) || isLoading}
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Image Preview Area */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pb-2">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.previewUrl}
                      alt={`Preview ${idx + 1}`}
                      className="w-14 h-14 object-cover rounded-md border border-border"
                    />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-destructive">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse [animation-delay:0.4s]" />
              </span>
              <span>{t('voiceListening')}</span>
            </div>
          )}
          
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            {t('poweredBy')}
          </p>
        </div>
      </div>
    </>,
    portalTarget
  );
}
