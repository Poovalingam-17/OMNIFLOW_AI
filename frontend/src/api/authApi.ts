import api from './axiosConfig';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

export const AuthApi = {
  login: async (credentials: { email: string; password?: string }) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: { email: string; password?: string; fullName: string }) => {
    const response = await api.post<UserResponse>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  checkEmail: async (email: string) => {
    const response = await api.get<{ exists: boolean }>('/auth/check-email', { params: { email } });
    return response.data;
  },

  googleLogin: async (email: string) => {
    const response = await api.post<LoginResponse>('/auth/google-login', { email });
    return response.data;
  }
};
