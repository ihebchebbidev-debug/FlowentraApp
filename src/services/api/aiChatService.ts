import axiosInstance from './axiosInstance';
const apiClient = axiosInstance;

// Types
export interface AiConversation {
  id: number;
  userId: string;
  title: string;
  summary?: string;
  lastMessageAt: string | null;
  messageCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
  messages?: AiMessage[];
}

export interface AiMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  feedback?: 'liked' | 'disliked';
  isRegenerated: boolean;
  createdAt: string;
}

export interface ConversationListResponse {
  conversations: AiConversation[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Conversation API
export const aiChatApi = {
  // Get all conversations
  async getConversations(
    pageNumber = 1, 
    pageSize = 20, 
    includeArchived = false
  ): Promise<ConversationListResponse> {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
      includeArchived: String(includeArchived),
    });
    const response = await apiClient.get(`/api/AiChat/conversations?${params}`);
    return response.data;
  },

  // Get single conversation with messages
  async getConversation(id: number, includeMessages = true): Promise<AiConversation> {
    // Guard: invalid id values cause backend 400/404 noise
    if (!id || !Number.isFinite(id) || id <= 0) {
      throw new Error(`getConversation: invalid id "${id}"`);
    }
    try {
      const response = await apiClient.get(
        `/api/AiChat/conversations/${id}?includeMessages=${includeMessages}`
      );
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.warn('[aiChatApi.getConversation] failed', {
        id,
        includeMessages,
        status,
        message: err?.message,
        responseData: typeof data === 'string' ? data.slice(0, 300) : data,
      });
      // Re-throw so callers can decide; attach helpful metadata
      const wrapped = new Error(
        `getConversation(${id}) failed${status ? ` [HTTP ${status}]` : ''}`
      ) as Error & { status?: number; cause?: unknown };
      wrapped.status = status;
      wrapped.cause = err;
      throw wrapped;
    }
  },

  // Create new conversation
  async createConversation(title?: string): Promise<AiConversation> {
    const response = await apiClient.post('/api/AiChat/conversations', { title });
    return response.data;
  },

  // Update conversation title
  async renameConversation(id: number, title: string): Promise<AiConversation> {
    const response = await apiClient.patch(`/api/AiChat/conversations/${id}`, { title });
    return response.data;
  },

  // Delete conversation
  async deleteConversation(id: number): Promise<void> {
    await apiClient.delete(`/api/AiChat/conversations/${id}`);
  },

  // Delete all conversations
  async deleteAllConversations(): Promise<void> {
    await apiClient.delete('/api/AiChat/conversations');
  },

  // Archive conversation
  async archiveConversation(id: number, archive = true): Promise<void> {
    await apiClient.post(`/api/AiChat/conversations/${id}/archive?archive=${archive}`);
  },

  // Pin conversation
  async pinConversation(id: number, pin = true): Promise<void> {
    await apiClient.post(`/api/AiChat/conversations/${id}/pin?pin=${pin}`);
  },

  // Add message to conversation
  async addMessage(
    conversationId: number, 
    role: 'user' | 'assistant', 
    content: string
  ): Promise<AiMessage> {
    const response = await apiClient.post('/api/AiChat/messages', {
      conversationId,
      role,
      content,
    });
    return response.data;
  },

  // Add multiple messages (bulk)
  async addMessages(
    conversationId: number, 
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AiMessage[]> {
    const response = await apiClient.post('/api/AiChat/messages/bulk', {
      conversationId,
      messages,
    });
    return response.data;
  },

  // Update message feedback
  async updateMessageFeedback(
    messageId: number, 
    feedback: 'liked' | 'disliked' | null
  ): Promise<AiMessage> {
    const response = await apiClient.patch(`/api/AiChat/messages/${messageId}/feedback`, {
      feedback,
    });
    return response.data;
  },

  // Delete message
  async deleteMessage(messageId: number): Promise<void> {
    await apiClient.delete(`/api/AiChat/messages/${messageId}`);
  },
};

export default aiChatApi;
