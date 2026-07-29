import api from './axiosConfig';

export interface Message {
  id?: number;
  conversationId?: number;
  senderType: 'USER' | 'AGENT';
  content: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  isRag?: boolean;
  sources?: string;
  createdAt: string;
}

export const ChatApi = {
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  createConversation: async (data: { agentId: number; title: string }) => {
    const response = await api.post('/conversations', data);
    return response.data;
  },

  getMessages: async (conversationId: number) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: number, content: string, imageBase64?: string) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, { content, imageBase64 });
    return response.data;
  },

  sendMessageStream: async (
    conversationId: number,
    content: string,
    onToken: (token: string) => void,
    onComplete: () => void,
    imageBase64?: string
  ) => {
    const token = localStorage.getItem('accessToken');
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const streamUrl = `${apiBase}/conversations/${conversationId}/messages/stream`;
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, imageBase64 })
    });

    if (!response.ok) {
      throw new Error('Failed to start stream');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Stream reader not available');
    }

    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const rawLine = line.replace(/\r/g, '');
        if (rawLine.startsWith('data:')) {
          const tokenContent = rawLine.slice(5);
          if (tokenContent && tokenContent !== '[DONE]') {
            try {
              const parsed = JSON.parse(tokenContent);
              if (parsed && typeof parsed.token === 'string') {
                onToken(parsed.token);
              } else {
                onToken(tokenContent);
              }
            } catch (e) {
              onToken(tokenContent);
            }
          }
        }
      }
    }

    if (buffer) {
      const rawLine = buffer.replace(/\r/g, '');
      if (rawLine.startsWith('data:')) {
        const tokenContent = rawLine.slice(5);
        if (tokenContent && tokenContent !== '[DONE]') {
          try {
            const parsed = JSON.parse(tokenContent);
            if (parsed && typeof parsed.token === 'string') {
              onToken(parsed.token);
            } else {
              onToken(tokenContent);
            }
          } catch (e) {
            onToken(tokenContent);
          }
        }
      }
    }
    
    onComplete();
  },

  deleteConversation: async (conversationId: number) => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  }
};
