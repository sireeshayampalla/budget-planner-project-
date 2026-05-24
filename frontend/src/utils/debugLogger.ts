import { safeStorage } from './safeStorage';

type LogType = 'info' | 'error' | 'success' | 'warn';

export interface LogEntry {
  timestamp: string;
  type: LogType;
  message: string;
}

const listeners = new Set<(logs: LogEntry[]) => void>();

const getPersistedLogs = (): LogEntry[] => {
  try {
    const data = safeStorage.getItem('budget_planner_debug_logs');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

let logs: LogEntry[] = getPersistedLogs();

// Load initial log if any
const getTimestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
};

export const addLog = (type: LogType, message: string) => {
  const entry: LogEntry = {
    timestamp: getTimestamp(),
    type,
    message: typeof message === 'object' ? JSON.stringify(message) : String(message)
  };
  logs = [entry, ...logs].slice(0, 150); // Keep last 150 logs
  try {
    safeStorage.setItem('budget_planner_debug_logs', JSON.stringify(logs));
  } catch (e) {}
  listeners.forEach(cb => cb(logs));
};

export const subscribeLogs = (cb: (logs: LogEntry[]) => void) => {
  listeners.add(cb);
  cb(logs);
  return () => {
    listeners.delete(cb);
  };
};

export const getLogs = () => logs;

export const clearLogs = () => {
  logs = [];
  try {
    safeStorage.removeItem('budget_planner_debug_logs');
  } catch (e) {}
  listeners.forEach(cb => cb(logs));
};

// Log initial message if logs are empty
if (logs.length === 0) {
  addLog('info', 'Debug logger initialized');
}
