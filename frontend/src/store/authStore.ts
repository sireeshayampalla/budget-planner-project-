import { create } from 'zustand';
import api from '../api/axios';

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage read failed for key ${key}:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage write failed for key ${key}:`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage delete failed for key ${key}:`, e);
    }
  }
};

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
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updatePreferences: (preferences: { avatar?: string; currency?: string; theme?: string; username?: string; email?: string }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(safeStorage.getItem('budget_planner_user') || 'null'),
  token: safeStorage.getItem('budget_planner_token'),
  isAuthenticated: !!safeStorage.getItem('budget_planner_token'),
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      const mappedUser = { ...user, id: user.id || user._id };

      safeStorage.setItem('budget_planner_token', token);
      safeStorage.setItem('budget_planner_user', JSON.stringify(mappedUser));

      set({
        token,
        user: mappedUser,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
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
      const mappedUser = { ...user, id: user.id || user._id };

      safeStorage.setItem('budget_planner_token', token);
      safeStorage.setItem('budget_planner_user', JSON.stringify(mappedUser));

      set({
        token,
        user: mappedUser,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
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
    safeStorage.removeItem('budget_planner_token');
    safeStorage.removeItem('budget_planner_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = safeStorage.getItem('budget_planner_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      const { user } = res.data.data;
      const mappedUser = { ...user, id: user.id || user._id };
      safeStorage.setItem('budget_planner_user', JSON.stringify(mappedUser));
      set({ user: mappedUser, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (err) {
      // Interceptor will handle clean up on 401, but we fallback here
      safeStorage.removeItem('budget_planner_token');
      safeStorage.removeItem('budget_planner_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },

  clearError: () => set({ error: null }),

  updatePreferences: async (preferences) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put('/users/profile', preferences);
      const { user } = res.data.data;
      const mappedUser = { ...user, id: user.id || user._id };
      safeStorage.setItem('budget_planner_user', JSON.stringify(mappedUser));
      set({ user: mappedUser, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update preferences';
      set({ error: msg, isLoading: false });
      return false;
    }
  },
}));
