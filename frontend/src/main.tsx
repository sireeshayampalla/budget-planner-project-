import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent ResizeObserver loop limit exceeded warnings/errors from crashing React in StrictMode
window.addEventListener('error', (e) => {
  if (
    e.message === 'ResizeObserver loop limit exceeded' || 
    e.message === 'ResizeObserver loop completed with undelivered notifications'
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
