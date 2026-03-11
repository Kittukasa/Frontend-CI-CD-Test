/**
 * API Client
 * Centralized Axios instance with request/response interceptors
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getToken, isValidToken } from '@/lib/auth';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Request interceptor - Attach auth token to all requests
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();

        // Only attach token if it's valid
        if (token && isValidToken(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data
            });
        }

        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
    (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data
            });
        }

        return response;
    },
    (error: AxiosError) => {
        // Extract error message
        const message = (error.response?.data as { error?: string })?.error
            || error.message
            || 'An unexpected error occurred';

        const status = error.response?.status;

        // Log error
        console.error('[API Error]', {
            url: error.config?.url,
            status,
            message,
            error
        });

        // Handle specific status codes
        if (status === 401 || status === 403) {
            // Token expired or invalid - trigger logout
            // We'll dispatch a custom event that AuthContext listens to
            window.dispatchEvent(new CustomEvent('auth:logout', {
                detail: { reason: 'Session expired. Please log in again.' }
            }));
        }

        if (status === 404) {
            console.warn('[API] Resource not found:', error.config?.url);
        }

        if (status === 500) {
            console.error('[API] Server error:', error);
        }

        // Return standardized error
        return Promise.reject({
            message,
            status,
            originalError: error
        });
    }
);

export default apiClient;
