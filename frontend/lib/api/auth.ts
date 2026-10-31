import { apiClient } from './client';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const authService = {
  async login(username: string, password: string): Promise<AuthUser> {
    const res = await apiClient.post<{ user: AuthUser }>('/auth/login', { username, password });
    return res.user;
  },
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  },
  async me(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<{ user: AuthUser | null }>('/auth/me');
      return res.user;
    } catch {
      return null;
    }
  },
};
