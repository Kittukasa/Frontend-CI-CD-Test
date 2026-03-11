export const ADMIN_TOKEN_KEY = 'bb_admin_token';
export const ADMIN_LOGIN_FLAG_KEY = 'billbox_admin_logged_in';
export const ADMIN_USER_KEY = 'billbox_admin_user';

export type StoredAdminIdentity = {
  adminName: string;
  displayName?: string | null;
};

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const persistAdminToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAdminToken = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const buildAdminAuthHeaders = (): HeadersInit => {
  const token = getAdminToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const withAdminAuthHeaders = (headers: HeadersInit = {}): HeadersInit => ({
  ...headers,
  ...buildAdminAuthHeaders(),
});

export const persistAdminIdentity = (identity: StoredAdminIdentity) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ADMIN_LOGIN_FLAG_KEY, 'true');
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(identity));
};

export const getStoredAdminIdentity = (): StoredAdminIdentity | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredAdminIdentity;
    if (parsed && typeof parsed.adminName === 'string') {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse admin identity', error);
  }
  return null;
};

export const clearAdminIdentity = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ADMIN_LOGIN_FLAG_KEY);
  window.localStorage.removeItem(ADMIN_USER_KEY);
};

export const clearAdminSession = () => {
  clearAdminToken();
  clearAdminIdentity();
};

type AdminJsonResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isAuthError?: boolean;
  isHtml?: boolean;
  raw?: string;
};

export const fetchAdminJson = async <T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<AdminJsonResult<T>> => {
  const response = await fetch(input, {
    ...init,
    headers: withAdminAuthHeaders(init.headers || {}),
    cache: 'no-store',
  });

  const status = response.status;
  if (status === 401 || status === 403) {
    return { ok: false, status, isAuthError: true };
  }

  const raw = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status,
      error: raw || response.statusText,
      raw,
    };
  }

  const contentType = response.headers.get('content-type') || '';
  const trimmed = raw.trim();
  const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');

  if (!contentType.includes('application/json') && !looksLikeJson) {
    return {
      ok: false,
      status,
      error: 'Received non-JSON response.',
      isHtml: /^<!doctype|^<html/i.test(trimmed),
      raw,
    };
  }

  try {
    const data = trimmed ? (JSON.parse(trimmed) as T) : ({} as T);
    return { ok: true, status, data };
  } catch (error) {
    return {
      ok: false,
      status,
      error: 'Failed to parse response.',
      raw,
      isHtml: /^<!doctype|^<html/i.test(trimmed),
    };
  }
};
