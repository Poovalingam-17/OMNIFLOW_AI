import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosConfig';

export interface Agent {
  id: number;
  name: string;
  domain: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  iconUrl?: string;
  colorHex?: string;
  createdAt?: string;
}

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  isLoading: false,
  error: null,
};

export const fetchAgents = createAsyncThunk(
  'agents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Agent[]>('/agents');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch agents');
    }
  }
);

export const toggleAgentActive = createAsyncThunk(
  'agents/toggleActive',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch<Agent>(`/agents/${id}/toggle`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle agent');
    }
  }
);

const agentSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(toggleAgentActive.fulfilled, (state, action) => {
        const index = state.agents.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
      });
  },
});

export default agentSlice.reducer;
