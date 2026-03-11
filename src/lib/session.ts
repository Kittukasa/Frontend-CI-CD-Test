import { CUSTOMER_TYPE_STORAGE_KEY } from '@/lib/customerTypes';

const AUTH_STORAGE_KEYS = [
  'bb_token',
  'bb_store_id',
  'bb_franchise_id',
  'bb_owner_mode',
  'bb_access_token',
  'bb_whatsapp_api_url',
  'bb_waba_id',
  'bb_phone_number_id',
  'bb_waba_mobile_number',
  'bb_template_name',
  'bb_template_language',
  'bb_vendor_name',
  'bb_verified_name',
  'bb_store_name',
  'bb_webhook_config',
  CUSTOMER_TYPE_STORAGE_KEY
];

const POST_LOGIN_REDIRECT_KEY = 'bb_post_login_redirect';
const SESSION_NOTICE_KEY = 'bb_session_notice';

let sessionRedirectInProgress = false;

const withBrowserStorage = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return;
  }
  callback();
};

export const clearAuthStorage = () => {
  withBrowserStorage(() => {
    AUTH_STORAGE_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore storage errors
      }
    });
  });
};

export const setPostLoginRedirect = (path: string | null) => {
  withBrowserStorage(() => {
    if (!path) {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      return;
    }
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
  });
};

export const getPostLoginRedirect = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
};

export const clearPostLoginRedirect = () => {
  withBrowserStorage(() => {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  });
};

export const setSessionNotice = (message: string | null) => {
  withBrowserStorage(() => {
    if (!message) {
      sessionStorage.removeItem(SESSION_NOTICE_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_NOTICE_KEY, message);
  });
};

export const consumeSessionNotice = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const message = sessionStorage.getItem(SESSION_NOTICE_KEY);
  if (message) {
    sessionStorage.removeItem(SESSION_NOTICE_KEY);
  }
  return message;
};

export const redirectToLoginDueToSessionExpiry = (message?: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (sessionRedirectInProgress) {
    return;
  }
  sessionRedirectInProgress = true;
  clearAuthStorage();
  setSessionNotice(message || 'Session expired. Please log in again.');

  if (window.location.pathname !== '/login') {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    setPostLoginRedirect(currentPath);
    window.location.replace('/login');
    return;
  }

  // Already on login page – no redirect needed but ensure flag resets.
  sessionRedirectInProgress = false;
};
