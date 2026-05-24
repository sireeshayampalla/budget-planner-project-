import axios from 'axios';
import { addLog } from '../utils/debugLogger';

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem('budget_planner_token');
    addLog('info', `API Request: ${config.method?.toUpperCase()} ${config.url} (Token present: ${!!token})`);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    addLog('error', `API Request Error: ${error.message}`);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => {
    addLog('success', `API Response Success: [${response.status}] ${response.config.url}`);
    return response;
  },
  (error) => {
    addLog('error', `API Response Error: ${error.message} - ${error.config?.url}`);
    if (error.response) {
      addLog('error', `Response status: ${error.response.status}, body: ${JSON.stringify(error.response.data)}`);
      if (error.response.status === 401) {
        // Clear storage and redirect if unauthorized
        safeStorage.removeItem('budget_planner_token');
        safeStorage.removeItem('budget_planner_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          addLog('warn', `Redirecting to /login due to 401 on protected route`);
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
