import { create } from 'zustand';
import api from '../api/axios';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  currency?: string;
  theme?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updatePreferences: (preferences: { avatar?: string; currency?: string; theme?: string; username?: string; email?: string }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('budget_planner_user') || 'null'),
  token: localStorage.getItem('budget_planner_token'),
  isAuthenticated: !!localStorage.getItem('budget_planner_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;

      localStorage.setItem('budget_planner_token', token);
      localStorage.setItem('budget_planner_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { username, email, password });
      const { token, user } = res.data.data;

      localStorage.setItem('budget_planner_token', token);
      localStorage.setItem('budget_planner_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('budget_planner_token');
    localStorage.removeItem('budget_planner_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('budget_planner_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      const { user } = res.data.data;
      localStorage.setItem('budget_planner_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // Interceptor will handle clean up on 401, but we fallback here
      localStorage.removeItem('budget_planner_token');
      localStorage.removeItem('budget_planner_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  updatePreferences: async (preferences) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put('/users/profile', preferences);
      const { user } = res.data.data;
      localStorage.setItem('budget_planner_user', JSON.stringify(user));
      set({ user, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update preferences';
      set({ error: msg, isLoading: false });
      return false;
    }
  },
}));
