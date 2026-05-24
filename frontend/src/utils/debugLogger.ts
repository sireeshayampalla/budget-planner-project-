type LogType = 'info' | 'error' | 'success' | 'warn';

export interface LogEntry {
  timestamp: string;
  type: LogType;
  message: string;
}

const listeners = new Set<(logs: LogEntry[]) => void>();
let logs: LogEntry[] = [];

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
  listeners.forEach(cb => cb(logs));
};

// Log initial message
addLog('info', 'Debug logger initialized');
