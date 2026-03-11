/**
 * Authentication utility functions
 * Centralized token management and validation
 */

import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'bb_token';
const TOKEN_EXPIRY_WARNING_MS = 5 * 60 * 1000; // 5 minutes before expiry

interface TokenPayload {
  store_id: string;
  franchise_id?: string;
  session_version?: number;
  iat: number;
  exp: number;
}

/**
 * Get the current JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save token to localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode JWT token and return payload
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // Token exp is in seconds, Date.now() is in milliseconds
  const expiryTime = decoded.exp * 1000;
  return Date.now() >= expiryTime;
}

/**
 * Get token expiry date
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}

/**
 * Check if token will expire soon (within warning window)
 */
export function isTokenExpiringSoon(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;
  
  const expiryTime = decoded.exp * 1000;
  const timeUntilExpiry = expiryTime - Date.now();
  
  return timeUntilExpiry > 0 && timeUntilExpiry <= TOKEN_EXPIRY_WARNING_MS;
}

/**
 * Get time remaining until token expires (in milliseconds)
 */
export function getTimeUntilExpiry(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const expiryTime = decoded.exp * 1000;
  const timeRemaining = expiryTime - Date.now();
  
  return Math.max(0, timeRemaining);
}

/**
 * Validate token and check expiry
 */
export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  if (isTokenExpired(token)) return false;
  return true;
}

/**
 * Get store ID from token
 */
export function getStoreIdFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.store_id || null;
}

/**
 * Clear all auth-related data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  const authKeys = [
    'bb_token',
    'bb_store_id',
    'bb_franchise_id',
    'bb_whatsapp_api_url',
    'bb_access_token',
    'bb_waba_id',
    'bb_phone_number_id',
    'bb_waba_mobile_number',
    'bb_template_name',
    'bb_template_language',
    'bb_vendor_name',
    'bb_verified_name',
    'bb_store_name',
    'bb_trial_started',
    'bb_trial_period',
    'bb_webhook_config',
    'bb_customer_type_config',
    'bb_owner_mode'
  ];
  
  authKeys.forEach(key => localStorage.removeItem(key));
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Expired';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${seconds}s`;
}
