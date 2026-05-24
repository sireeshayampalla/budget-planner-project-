import React, { useState, useEffect, useRef } from 'react';
import { addLog, subscribeLogs, clearLogs } from '../../utils/debugLogger';
import type { LogEntry } from '../../utils/debugLogger';
import api from '../../api/axios';

export const DebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [localStorageOk, setLocalStorageOk] = useState(false);
  const [tokenPresent, setTokenPresent] = useState(false);
  const [tokenVal, setTokenVal] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check storage support
    try {
      localStorage.setItem('__test_key__', 'test');
      localStorage.removeItem('__test_key__');
      setLocalStorageOk(true);
    } catch (e) {
      setLocalStorageOk(false);
    }

    // Check token state
    const t = localStorage.getItem('budget_planner_token');
    setTokenPresent(!!t);
    setTokenVal(t ? t.substring(0, 15) + '...' : null);

    // Subscribe to debug logs
    const unsubscribe = subscribeLogs((currentLogs) => {
      setLogs(currentLogs);
    });

    // Intercept console messages
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      addLog('info', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      addLog('error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalWarn.apply(console, args);
    };

    // Global script error listener
    const handleGlobalError = (event: ErrorEvent) => {
      addLog('error', `Global JS Error: ${event.message} at ${event.filename}:${event.lineno}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      addLog('error', `Unhandled Promise Rejection: ${reason && reason.message ? reason.message : JSON.stringify(reason)}`);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      unsubscribe();
    };
  }, []);

  const handleTestAPI = async () => {
    addLog('info', 'Testing connection to API health check...');
    try {
      const res = await api.get('/health');
      addLog('success', `API Health response: ${res.status} - ${JSON.stringify(res.data)}`);
    } catch (e: any) {
      addLog('error', `API Health request failed: ${e.message || JSON.stringify(e)}`);
      if (e.response) {
        addLog('error', `Response status: ${e.response.status}, body: ${JSON.stringify(e.response.data)}`);
      }
    }
  };

  const handleRefreshState = () => {
    try {
      const t = localStorage.getItem('budget_planner_token');
      setTokenPresent(!!t);
      setTokenVal(t ? t.substring(0, 15) + '...' : null);
      addLog('info', `Refreshed token status. Present: ${!!t}`);
    } catch (e: any) {
      addLog('error', `Refresh status failed: ${e.message}`);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 999999 }}>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Toggle Debug Console"
      >
        🛠️
      </button>

      {/* Logs Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '16px',
            width: '90%',
            maxWidth: '450px',
            height: '70vh',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'col' as any,
            overflow: 'hidden',
            border: '1px solid #475569',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #475569',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0f172a',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#818cf8' }}>Mobile Diagnostics</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              ❌
            </button>
          </div>

          {/* Diagnostic Info Panel */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#0f172a',
              borderBottom: '1px solid #475569',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            <div>Storage Support: <span style={{ color: localStorageOk ? '#10b981' : '#f43f5e' }}>{localStorageOk ? 'YES' : 'NO'}</span></div>
            <div>Auth Token: <span style={{ color: tokenPresent ? '#10b981' : '#f59e0b' }}>{tokenPresent ? 'OK' : 'MISSING'}</span></div>
            <div style={{ gridColumn: 'span 2' }}>Token Value: <code style={{ color: '#e2e8f0' }}>{tokenVal || 'null'}</code></div>
            <div style={{ gridColumn: 'span 2' }}>API Endpoint: <code style={{ color: '#e2e8f0' }}>{import.meta.env.VITE_API_URL || '/api'}</code></div>
          </div>

          {/* Controls */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #475569',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#1e293b',
            }}
          >
            <button
              onClick={handleTestAPI}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Test API Link
            </button>
            <button
              onClick={handleRefreshState}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Refresh Token Check
            </button>
            <button
              onClick={clearLogs}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Clear Logs
            </button>
          </div>

          {/* Scrollable logs list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 14px',
              backgroundColor: '#090d16',
              display: 'flex',
              flexDirection: 'column-reverse',
            }}
          >
            <div ref={logEndRef} />
            {logs.map((log, idx) => {
              let color = '#f8fafc'; // info
              if (log.type === 'error') color = '#f43f5e';
              else if (log.type === 'success') color = '#10b981';
              else if (log.type === 'warn') color = '#fbbf24';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px solid #1e293b',
                    lineHeight: '1.4',
                    wordBreak: 'break-all',
                    color,
                  }}
                >
                  <span style={{ color: '#64748b', marginRight: '6px' }}>[{log.timestamp}]</span>
                  <span>{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
