import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { redirectToLoginDueToSessionExpiry } from '@/lib/session';

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);
  const shouldSkipRedirect = (url: string) => {
    const normalized = url || '';
    if (!normalized.startsWith('http') && !normalized.startsWith('/')) {
      return false;
    }
    const skipEndpoints = [
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/send-otp',
      '/api/auth/reset-password',
      '/api/auth/franchise',
      '/api/auth/revenue-pin/verify',
    ];
    return skipEndpoints.some(endpoint => normalized.includes(endpoint));
  };

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const hasToken = Boolean(localStorage.getItem('bb_token'));
      const requestInfo = args[0];
      const requestUrl =
        typeof requestInfo === 'string'
          ? requestInfo
          : requestInfo instanceof Request
          ? requestInfo.url
          : '';

      if (response?.status === 401 && hasToken && requestUrl && !shouldSkipRedirect(requestUrl)) {
        let message: string | undefined;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const parsed = await response.clone().json();
            if (parsed?.error && typeof parsed.error === 'string') {
              message = parsed.error;
            }
          }
        } catch {
          // ignore parse errors
        }
        redirectToLoginDueToSessionExpiry(message);
      }
    } catch {
      // ignore interception errors
    }
    return response;
  };
}

createRoot(document.getElementById('root')!).render(<App />);
