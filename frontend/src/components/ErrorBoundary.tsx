import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', margin: '20px', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Render Crash Captured</h2>
          <p style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'semibold' }}>{this.state.error?.toString()}</p>
          <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #fca5a5', maxHeight: '200px', overflowY: 'auto', color: '#374151', fontFamily: 'monospace' }}>
            {this.state.errorInfo?.componentStack || 'Gathering component stack trace...'}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            Retry / Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
