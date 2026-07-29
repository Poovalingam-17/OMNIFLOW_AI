import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatApi, Message } from '../api/chatApi';
import { Agent } from './agentSlice';

export interface Conversation {
  id: number;
  userId: number;
  agent: Agent;
  title: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messages: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await ChatApi.getConversations();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (payload: { agentId: number; title: string }, { rejectWithValue }) => {
    try {
      return await ChatApi.createConversation(payload);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: number, { rejectWithValue }) => {
    try {
      return await ChatApi.getMessages(conversationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: { conversationId: number; content: string; imageBase64?: string }, { rejectWithValue }) => {
    try {
      return await ChatApi.sendMessage(payload.conversationId, payload.content, payload.imageBase64);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const sendMessageStream = createAsyncThunk(
  'chat/sendMessageStream',
  async (payload: { conversationId: number; content: string; imageBase64?: string }, { dispatch, rejectWithValue }) => {
    try {
      await ChatApi.sendMessageStream(
        payload.conversationId,
        payload.content,
        (token) => {
          dispatch(addStreamingToken(token));
        },
        () => {
          dispatch(completeStreaming());
        },
        payload.imageBase64
      );
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message stream');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId: number, { dispatch, rejectWithValue }) => {
    try {
      await ChatApi.deleteConversation(conversationId);
      dispatch(fetchConversations());
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete conversation');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    selectConversation: (state, action: PayloadAction<number>) => {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) {
        state.currentConversation = conv;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
    },
    addStreamingToken: (state, action: PayloadAction<string>) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.senderType === 'AGENT') {
        lastMsg.content += action.payload;
      }
    },
    completeStreaming: (state) => {
      state.isStreaming = false;
      if (state.currentConversation) {
        state.currentConversation.messageCount += 2;
      }
    },
    addLocalMessage: (state, action: PayloadAction<{ senderType: 'USER' | 'AGENT'; content: string; isRag?: boolean; sources?: string }>) => {
      state.messages.push({
        ...action.payload,
        createdAt: new Date().toISOString()
      });
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
        if (state.currentConversation) {
          const fresh = action.payload.find((c: any) => c.id === state.currentConversation?.id);
          if (fresh) {
            state.currentConversation = fresh;
          }
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
        state.messages = [];
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Send Message (Sync)
      .addCase(sendMessage.pending, (state, action) => {
        state.isStreaming = true;
        state.messages.push({
          senderType: 'USER',
          content: action.meta.arg.content,
          createdAt: new Date().toISOString(),
        });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isStreaming = false;
        state.messages.push(action.payload);
        if (state.currentConversation) {
          state.currentConversation.messageCount += 2;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isStreaming = false;
        state.error = action.payload as string;
      })
      // Send Message Stream
      .addCase(sendMessageStream.pending, (state, action) => {
        state.isStreaming = true;
        state.messages.push({
          senderType: 'USER',
          content: action.meta.arg.content,
          createdAt: new Date().toISOString(),
        });
        state.messages.push({
          senderType: 'AGENT',
          content: '',
          createdAt: new Date().toISOString(),
        });
      })
      .addCase(sendMessageStream.rejected, (state, action) => {
        state.isStreaming = false;
        state.error = action.payload as string;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
          state.messages = [];
        }
      });
  },
});

export const { selectConversation, clearMessages, addStreamingToken, completeStreaming, addLocalMessage, setStreaming } = chatSlice.actions;
export default chatSlice.reducer;
