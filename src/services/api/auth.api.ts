/**
 * Authentication API endpoints
 */

import apiClient from './client';

export interface LoginCredentials {
    store_id: string;
    password: string;
    otp?: string;
}

export interface LoginResponse {
    token: string;
    store_id: string;
    franchise_id?: string;
    whatsapp_api_url?: string;
    access_token?: string;
    waba_id?: string;
    phone_number_id?: string;
    waba_mobile_number?: string;
    template_name?: string;
    template_language?: string;
    vendor_name?: string;
    verified_name?: string;
    store_name?: string;
    trial_started?: string;
    trial_period?: number;
    webhook_config?: unknown;
    customer_type_config?: unknown;
}

export interface SendOtpRequest {
    store_id: string;
    password: string;
}

export interface SendOtpResponse {
    success: boolean;
    masked_phone?: string;
}

/**
 * Login with password (and OTP if two-step verification is enabled)
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/password', credentials);
    return response.data;
}

/**
 * Login with password only (when two-step verification is disabled)
 */
export async function loginPasswordOnly(credentials: Omit<LoginCredentials, 'otp'>): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/password-only', credentials);
    return response.data;
}

/**
 * Send OTP for login
 */
export async function sendLoginOtp(request: SendOtpRequest): Promise<SendOtpResponse> {
    const response = await apiClient.post<SendOtpResponse>('/auth/login/password/send-otp', request);
    return response.data;
}

/**
 * Get login configuration
 */
export async function getLoginConfig(): Promise<{ two_step_verification: boolean }> {
    const response = await apiClient.get('/auth/login/config');
    return response.data;
}

/**
 * Check if store exists
 */
export async function checkStoreExists(storeId: string): Promise<boolean> {
    try {
        const response = await apiClient.get('/auth/login/options', {
            params: { store_id: storeId }
        });
        return response.status === 200;
    } catch {
        return false;
    }
}
