// Memory fallback dictionary for strict privacy environments
const memoryStorage: Record<string, string> = {};

// Cookie fallback helpers
const getCookie = (name: string): string | null => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  } catch (e) {}
  return null;
};

const setCookie = (name: string, value: string, days = 7) => {
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax; Secure`;
  } catch (e) {}
};

const removeCookie = (name: string) => {
  try {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  } catch (e) {}
};

/**
 * Safe local storage wrapper.
 * Falls back to document cookies and in-memory storage if localStorage is blocked by privacy controls.
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch (e) {}
    
    // Cookie fallback: only read token and theme from cookies
    if (key === 'budget_planner_token' || key === 'budget_planner_theme') {
      const cookieVal = getCookie(key);
      if (cookieVal !== null) return cookieVal;
    }

    // Memory fallback
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
      return;
    } catch (e) {}

    // Cookie fallback: only write token and theme to cookies to prevent header bloat
    if (key === 'budget_planner_token' || key === 'budget_planner_theme') {
      setCookie(key, value);
    }

    // Memory fallback
    memoryStorage[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    
    // Cookie fallback
    if (key === 'budget_planner_token' || key === 'budget_planner_theme') {
      removeCookie(key);
    }

    // Memory fallback
    delete memoryStorage[key];
  }
};
