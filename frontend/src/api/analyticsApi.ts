import api from './axiosConfig';

export interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalConversations: number;
  avgRating: number;
}

export interface AgentPerformance {
  name: string;
  successRate: number;
  avgResponseTime: number;
}

export interface DailyStat {
  date: string;
  queries: number;
  successRate: number;
}

export interface UsageStats {
  totalTokens: number;
  estimatedCost: number;
  queriesByAgent: Record<string, number>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStats>('/analytics/dashboard');
  return response.data;
};

export const getAgentPerformance = async (): Promise<AgentPerformance[]> => {
  const response = await api.get<AgentPerformance[]>('/analytics/agents/performance');
  return response.data;
};

export const getDailyStats = async (startDate: Date, endDate: Date): Promise<DailyStat[]> => {
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const response = await api.get<DailyStat[]>('/analytics/daily', {
    params: { startDate: fmt(startDate), endDate: fmt(endDate) },
  });
  return response.data;
};

export const getUsageStats = async (period = 'all'): Promise<UsageStats> => {
  const response = await api.get<UsageStats>('/analytics/usage', { params: { period } });
  return response.data;
};

export const submitFeedback = async (data: {
  conversationId: number;
  messageId?: number;
  rating: number;
  comment?: string;
}): Promise<void> => {
  await api.post('/feedback', data);
};
